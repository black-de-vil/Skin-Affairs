import Stripe from "stripe";

// Same story as ImageKit: `new Stripe(undefined)` throws, and the credit
// controller and the webhook are both imported from server.js, so a server
// without Stripe keys could not start at all. Payments now fail with a clear
// message instead of taking everything else with them.
let client = null;

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

const getStripe = () => {
    if (!isStripeConfigured()) {
        throw new Error("Payments aren't configured on this server yet.");
    }
    if (!client) {
        client = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return client;
};

export default getStripe;
