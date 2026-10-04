import getStripe from "../configs/stripe.js";
import Transaction from "../models/Transaction.js";

// Pricing plans kept server-side — never trust a price sent from the client
export const PLANS = [
    { id: "basic", name: "Basic", price: 10, credits: 100 },
    { id: "pro", name: "Pro", price: 30, credits: 500 },
    { id: "premium", name: "Premium", price: 80, credits: 1500 },
];

// POST /api/credit/purchase
export const purchasePlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const { planId } = req.body;

        const plan = PLANS.find((p) => p.id === planId);
        if (!plan) {
            return res.json({ success: false, message: "Invalid plan selected" });
        }

        // Record the pending purchase now — the webhook will mark it paid
        // once Stripe confirms the payment actually went through
        const transaction = await Transaction.create({
            userId,
            planId: plan.id,
            amount: plan.price,
            credits: plan.credits,
            isPaid: false,
        });

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `${plan.name} Plan — ${plan.credits} credits`,
                        },
                        unit_amount: plan.price * 100, // Stripe expects the amount in cents
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/credits?success=true`,
            cancel_url: `${process.env.CLIENT_URL}/credits?success=false`,
            metadata: {
                transactionId: transaction._id.toString(),
                appId: 'quickgpt',
            },
        });

        return res.json({ success: true, url: session.url });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};