import { verifyToken } from "../lib/auth.js";
import { db } from "../lib/firebase.js";

export default async function handler(req, res) {

    try {

        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        const user = await verifyToken(token);

        if (!user) {
            return res.status(401).json({
                error: "Invalid Token"
            });
        }

        const ref = db.collection("users").doc(user.uid);

        if (req.method === "GET") {

            const snap = await ref.get();

            if (!snap.exists) {

                return res.json({

                    signalNotify: true,
                    soundNotify: true,
                    telegramNotify: false,
                    browserNotify: false,

                    defaultPair: "EUR/USD",
                    defaultTf: "1 Minute",
                    refreshRate: "15 Seconds",

                    animation: true,
                    compact: false

                });

            }

            return res.json(snap.data().settings || {});

        }

        if (req.method === "POST") {

            await ref.set({

                settings: req.body

            }, {

                merge: true

            });

            return res.json({

                success: true

            });

        }

        return res.status(405).json({

            error: "Method Not Allowed"

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            error: err.message

        });

    }

}