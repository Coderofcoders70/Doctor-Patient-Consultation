const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// to test the invalid email format
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const register = async (req, res) => {
    try {
        const { name, email, password, role, specialization, experience } = req.body;

        // basic validation 
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // check email format
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check for duplicate email
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user and doctor profile if applicable using a Prisma transaction
        const newUser = await prisma.$transaction(async (prismaClient) => {
            const user = await prismaClient.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
                },
            });

            // If the role is DOCTOR, create the associated Doctor profile
            if (role === 'DOCTOR') {
                if (!specialization || experience === undefined) {
                    throw new Error('Specialization and experience are required for doctors');
                }
                await prismaClient.doctor.create({
                    data: {
                        userId: user.id,
                        specialization,
                        experience: parseInt(experience, 10),
                    },
                });
            }

            return user;
        });

        res.status(201).json({
            message: 'User registered successfully',
            userId: newUser.id
        });

    } catch (error) {
        console.error('Registration Error:', error);

        if (error.message === 'Specialization and experience are required for doctors') {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if the user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate the JWT using user id and role
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProfile = async (req, res) => {
    try {
        // The userId is provided by our authenticateToken middleware
        const userId = req.user.userId;

        // Fetch the user, explicitly asking Prisma to include the doctorProfile if it exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                doctorProfile: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ profile: user });
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    getProfile
};