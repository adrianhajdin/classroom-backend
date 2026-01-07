import type {Request, Response, NextFunction} from "express";
import aj from '../config/arcjet';
import {ArcjetNodeRequest, slidingWindow} from "@arcjet/node";

const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if(process.env.NODE_ENV === 'test') return next();

    try {
        const role: RateLimitRole = req.user?.role ?? 'guest';

        let limit: number;
        let message: string;

        switch (role) {
            case 'admin':
                limit=20;
                message ='Admin request limit exceeded (20 per minute). Slow down.';
                break;
            case 'teacher':
            case 'student':
                limit=10;
                message ='User request limit exceeded (10 per minute). Please wait.';
                break;
            default:
                limit=5
                message ='Guest request limit exceeded (5 per minute). Please sign up for higher limits.'
                    break;
        }

        const client = aj.withRule(
            slidingWindow({
                mode: 'LIVE',
                interval: '1m',
                max: limit,
            })
        )

        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.originalUrl ?? req.url,
            socket: { remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0'},
        }

        const decision = await client.protect(arcjetRequest);

        if(decision.isDenied() && decision.reason.isBot()) {
            return res.status(403).json({ error: 'Forbidden', message: 'Automated requests are not allowed.'});
        }

        if(decision.isDenied() && decision.reason.isShield()) {
            return res.status(403).json({ error: 'Forbidden', message: 'Request blocked by security policy' });
        }

        if(decision.isDenied() && decision.reason.isRateLimit()) {
            return res.status(429).json({ error: 'Too many requests.', message });
        }

        next();
    } catch (e) {
        console.error('Arcjet middleware error: ', e);
        res.status(500).json({ error: 'Internal error', message: 'Something went wrong with security middleware' });
    }
}

export default securityMiddleware;
