const authService = require('../services/authService');
const { success } = require('../utils/response');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const { user, accessToken, refreshToken } = await authService.login({ email, password, rememberMe });
    if (refreshToken) res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    success(res, { user, accessToken });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, data: null });
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const result = await authService.refresh(token);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    success(res, { user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, refresh, me };
