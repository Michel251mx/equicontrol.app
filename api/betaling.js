const { createMollieClient } = require('@mollie/api-client');

const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pakket, userId, userEmail } = req.body;

  const pakketten = {
    starter: { bedrag: '9.99', beschrijving: 'EquiControl Starter - 5 analyses', credits: 5 },
    extra1: { bedrag: '2.99', beschrijving: 'EquiControl - 1 extra analyse', credits: 1 },
    extra3: { bedrag: '5.99', beschrijving: 'EquiControl - 3 extra analyses', credits: 3 },
    extra10: { bedrag: '14.99', beschrijving: 'EquiControl - 10 extra analyses', credits: 10 },
  };

  const gekozenPakket = pakketten[pakket];
  if (!gekozenPakket) {
    return res.status(400).json({ error: 'Ongeldig pakket' });
  }

  try {
    const betaling = await mollie.payments.create({
      amount: { currency: 'EUR', value: gekozenPakket.bedrag },
      description: gekozenPakket.beschrijving,
      redirectUrl: 'https://equicontrol-app.vercel.app/betaling-succes.html?userId=' + userId + '&pakket=' + pakket,
      webhookUrl: 'https://equicontrol-app.vercel.app/api/webhook',
      metadata: { userId, pakket, credits: gekozenPakket.credits, userEmail },
    });

    res.status(200).json({ betalingUrl: betaling.getCheckoutUrl() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
