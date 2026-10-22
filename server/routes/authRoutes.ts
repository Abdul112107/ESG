import { Router, Response } from 'express';
import { z } from 'zod';
import { dal } from '../db/dal';
import { authService, requireAuth, AuthenticatedRequest } from '../services/authService';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['Admin', 'Manager', 'Employee', 'Auditor']).optional().default('Employee'),
  organizationId: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: parseResult.error.issues[0]?.message || 'Validation error' 
      });
    }

    const { name, email, password, role, organizationId } = parseResult.data;

    // Strict password policy validation
    const pwdCheck = authService.validatePassword(password);
    if (!pwdCheck.isValid) {
      return res.status(400).json({ success: false, error: pwdCheck.error });
    }

    // Check existing email
    const existing = await dal.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this email address already exists.' });
    }

    // Resolve organization ID
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId) {
      const defaultOrg = await dal.getFirstOrganization();
      resolvedOrgId = defaultOrg?._id || 'default-org';
    }

    const passwordHash = await authService.hashPassword(password);
    const newUser = await dal.createUser({
      name,
      email,
      passwordHash,
      role,
      organizationId: resolvedOrgId,
      isActive: true
    });

    const token = authService.generateToken({
      userId: newUser._id || newUser.id,
      email: newUser.email,
      role: newUser.role,
      organizationId: newUser.organizationId
    });

    const { passwordHash: _, ...userSafe } = newUser;

    return res.status(201).json({
      success: true,
      token,
      user: userSafe
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const { email, password } = parseResult.data;
    const user = await dal.findUserByEmail(email);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account has been deactivated. Please contact your administrator.' });
    }

    const isMatch = await authService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = authService.generateToken({
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    });

    const { passwordHash: _, ...userSafe } = user;

    return res.json({
      success: true,
      token,
      user: userSafe
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Login error: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await dal.findUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    const org = await dal.findOrganizationById(user.organizationId);

    return res.json({
      success: true,
      user,
      organization: org
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
