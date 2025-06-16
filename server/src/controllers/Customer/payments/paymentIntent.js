import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res
        .status(400)
        .json({ message: "Amount and currency are required." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe needs smallest unit (paise/fils)
      currency,
      automatic_payment_methods: { enabled: true ,allow_redirects: 'never'}
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error("Stripe PaymentIntent Error:", error);
    res.status(500).json({ message: "PaymentIntent creation failed" });
  }
};

// ONLY for dev testing - DO NOT use in production
export const confirmTestPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa", // Stripe's test payment method
    });

    res.status(200).json({
      message: "PaymentIntent confirmed successfully",
      status: intent.status,
      intent
    });
  } catch (error) {
    console.error("Confirm intent error:", error);
    res.status(400).json({ message: error.message });
  }
};

