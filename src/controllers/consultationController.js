const prisma = require('../config/db');

const createConsultation = async (req, res) => {
    try {
        const { doctorId } = req.body;
        const patientId = req.user.userId;

        // strict rule only patients can create consultations
        if (req.user.role !== 'PATIENT') {
            return res.status(403).json({ error: 'Only patients can initiate a consultation' });
        }

        if (!doctorId) {
            return res.status(400).json({ error: 'Doctor ID is required' });
        }

        const doctor = await prisma.user.findFirst({ where: { id: doctorId, role: 'DOCTOR' } });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const consultation = await prisma.consultation.create({
            data: {
                patientId,
                doctorId,
                // Status defaults to PENDING
            }
        });

        res.status(201).json({ message: 'Consultation created successfully', consultation });
    } catch (error) {
        console.error('Create Consultation Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getConsultations = async (req, res) => {
    try {
        const { userId, role } = req.user;

        // Adding pagination logic 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // It returns consultations based on who is asking
        const whereClause = role === 'PATIENT' ? { patientId: userId } : { doctorId: userId };

        // Fetch the total count for frontend pagination math
        const totalConsultations = await prisma.consultation.count({ where: whereClause });

        const consultations = await prisma.consultation.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            include: {
                patient: {
                    select: { id: true, name: true, email: true }
                },
                doctor: {
                    select: {
                        id: true,
                        specialization: true,
                        experience: true,
                        user: { // To fetch the selected user name and email
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            data: consultations,
            meta: {
                total: totalConsultations,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalConsultations / limit)
            }
        });
        
    } catch (error) {
        console.error('Get Consultations Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getConsultationById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.user;

        const consultation = await prisma.consultation.findUnique({
            where: { id: parseInt(id) },
            include: {
                patient: {
                    select: { id: true, name: true }
                },
                doctor: {
                    select: {
                        id: true,
                        specialization: true,
                        user: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        // Ensure the user is part of this specific consultation
        if (role === 'PATIENT' && consultation.patientId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to this consultation' });
        }
        if (role === 'DOCTOR' && consultation.doctorId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to this consultation' });
        }

        res.status(200).json(consultation);
    } catch (error) {
        console.error('Get Consultation By ID Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateConsultationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const doctorId = req.user.userId;

        // strict rule that only doctors can change status
        if (req.user.role !== 'DOCTOR') {
            return res.status(403).json({ error: 'Only doctors can update consultation status' });
        }

        const consultation = await prisma.consultation.findUnique({ where: { id: parseInt(id) } });
        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        // strict rule only the assigned doctor can change status
        if (consultation.doctorId !== doctorId) {
            return res.status(403).json({ error: 'You are not assigned to this consultation' });
        }

        // strict rule that completed consultations cannot be modified
        if (consultation.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Completed consultations cannot be modified' });
        }

        const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status provided' });
        }

        const updatedConsultation = await prisma.consultation.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.status(200).json({ message: 'Status updated successfully', consultation: updatedConsultation });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createConsultation,
    getConsultations,
    getConsultationById,
    updateConsultationStatus
};