import { default as pricingData } from '../utils/modelPricing.json' with { type: 'json' };;

export function usageCostPlugin({ pricing = {} } = {}) {
  const modelPricing = {
    ...pricingData,
    ...pricing
  };

  console.log('Model Pricing:', modelPricing);

  return {
    on: {
      "response.completed": (chunk, status, curResult) => {
        const model = chunk.response.model || "unknown";
        const usage = chunk.response.usage;
        if (!usage) return curResult;

        console.log('Calculating usage cost for model:', model);
        console.log('Usage data:', modelPricing[model]);

        const rate = modelPricing[model];
        let cost = 0;

        if (rate) {
          const inputTokens = usage.input_tokens || 0;
          const cachedTokens = usage.input_tokens_details?.cached_tokens || 0;
          const outputTokens = usage.output_tokens || 0;

          cost =
            ((inputTokens - cachedTokens) / 1_000_000) * rate.input +
            (cachedTokens / 1_000_000) * (rate.cached ?? rate.input) +
            (outputTokens / 1_000_000) * rate.output;

          console.log('Input', ((inputTokens - cachedTokens) / 1_000_000) * rate.input);
          console.log('Cached', (cachedTokens / 1_000_000) * (rate.cached ?? rate.input));
          console.log('Output', (outputTokens / 1_000_000) * rate.output);
          console.log('Total Cost:', cost);
        }

        return {
          ...curResult,
          cost: `$${cost.toFixed(6)}`,
          model
        };
      }
    }
  };
}
