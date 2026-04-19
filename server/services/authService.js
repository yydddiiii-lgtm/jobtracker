const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');
const { Errors } = require('../utils/errors');

const SALT_ROUNDS = 12;

const generateAccessToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  });

const generateRefreshToken = (user) =>
  jwt.sign({ sub: user.id, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const register = async ({ email, password, name }) => {
  if (!email || !password || !name) throw Errors.validation('email, password and name are required');
  const existing = await userRepo.findByEmail(email);
  if (existing) throw Errors.conflict('Email already registered');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepo.create({ email, passwordHash, name });
  const accessToken = generateAccessToken(user);
  return { user, accessToken };
};

const login = async ({ email, password, rememberMe }) => {
  if (!email || !password) throw Errors.validation('email and password are required');
  const user = await userRepo.findByEmail(email);
  if (!user) throw Errors.unauthorized('Invalid email or password');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw Errors.unauthorized('Invalid email or password');
  const { password_hash, ...safeUser } = user;
  const accessToken = generateAccessToken(safeUser);
  const refreshToken = rememberMe ? generateRefreshToken(safeUser) : null;
  return { user: safeUser, accessToken, refreshToken };
};

const refresh = (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') throw new Error('not a refresh token');
    const accessToken = generateAccessToken({ id: payload.sub, email: payload.email });
    return { accessToken };
  } catch {
    throw Errors.unauthorized('Invalid or expired refresh token');
  }
};

const me = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw Errors.notFound('User not found');
  return user;
};

module.exports = { register, login, refresh, me };
