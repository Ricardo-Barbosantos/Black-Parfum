import { sign, verify } from 'jsonwebtoken';

// Gerar token JWT para autenticação
export const generateAuthToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return sign(payload, secret, { expiresIn });
};

// Verificar token JWT
export const verifyAuthToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = verify(token, secret);
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    return null;
  }
};

// Middleware de autenticação
export const authenticateUser = (handler) => {
  return async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso negado: Token ausente ou inválido.' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Acesso negado: Token inválido.' });
    }

    // Adiciona o usuário decodificado ao objeto da requisição
    req.user = decoded;

    return handler(req, res);
  };
};