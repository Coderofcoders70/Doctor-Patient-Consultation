const prisma = require('../config/db');

// Fetch all the doctors
const getDoctors = async (req, res) => {

    // strict rule that only patient can browse the available list of doctors
    if (req.user.role !== 'PATIENT') {
        return res.status(403).json({ error: 'Only patients can browse the list of available doctors' });
    }

    try {
        const doctors = await prisma.user.findMany({
            where: { role: 'DOCTOR' },
            select: {
                id: true,
                name: true,
                doctorProfile: {
                    select: {
                        specialization: true,
                        experience: true,
                    }
                }
            }
        });

        // It helps to format the response 
        const formattedDoctors = doctors.map(doc => ({
            id: doc.id,
            name: doc.name,
            specialization: doc.doctorProfile?.specialization,
            experience: doc.doctorProfile?.experience
        }));

        res.status(200).json(formattedDoctors);
    } catch (error) {
        console.error('Fetch Doctors Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Fetch the single doctor using their id
const getDoctorById = async (req, res) => {
    try {

        if (req.user.role !== 'PATIENT') {
            return res.status(403).json({ error: 'Only patients can view doctor details' });
        }

        const { id } = req.params;
        const doctor = await prisma.user.findFirst({
            where: { id: parseInt(id), role: 'DOCTOR' },
            select: {
                id: true,
                name: true,
                doctorProfile: {
                    select: {
                        specialization: true,
                        experience: true,
                    }
                }
            }
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.status(200).json({
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.doctorProfile?.specialization,
            experience: doctor.doctorProfile?.experience
        });
    } catch (error) {
        console.error('Fetch Doctor By ID Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getDoctors,
    getDoctorById
};