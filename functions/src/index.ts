import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { z } from 'zod';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
admin.initializeApp();

const corsHandler = cors({ origin: true });

// Esquema de validación para la suscripción
const subscriptionSchema = z.object({
    userId: z.string(),
    planId: z.enum(['basic', 'premium']),
    amount: z.number().positive(),
});

/**
 * Crea una preferencia de pago en Mercado Pago
 */
export const createPaymentPreference = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        try {
            // 1. Validar datos de entrada con Zod
            const data = subscriptionSchema.parse(req.body);

            // 2. Configurar Mercado Pago
            const client = new MercadoPagoConfig({
                accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-YOUR-TOKEN'
            });
            const preference = new Preference(client);

            // 3. Crear el objeto de preferencia
            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: data.planId,
                            title: `Suscripción Mensual - Plan ${data.planId}`,
                            quantity: 1,
                            unit_price: data.amount,
                        },
                    ],
                    external_reference: data.userId,
                    notification_url: 'https://tu-dominio.com/webhook', // Endpoint de IPN
                },
            });

            res.status(200).json({ preferenceId: result.id });
        } catch (error) {
            console.error('Error creating preference:', error);
            res.status(400).json({ error: 'Invalid request or payment error' });
        }
    });
});
