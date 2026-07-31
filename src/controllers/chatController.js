const prisma = require('../config/db');

const sendMessage = async (req, res) => {
  try {
    const { id } = req.params; // will use consultation id
    const { message } = req.body;
    const { userId, role } = req.user;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Fetch the consultation to check rules
    const consultation = await prisma.consultation.findUnique({
      where: { id: parseInt(id) },
      include: { doctor: true } // Need doctor profile to get the check the user id
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // strict rule which is messages cannot be sent once the consultation is completed
    if (consultation.status === 'COMPLETED') {
      return res.status(403).json({ error: 'Cannot send messages in a completed consultation' });
    }

    // strict rule given that only the assigned doctor and patient can send messages
    const isAssignedPatient = role === 'PATIENT' && consultation.patientId === userId;
    const isAssignedDoctor = role === 'DOCTOR' && consultation.doctor.userId === userId;

    if (!isAssignedPatient && !isAssignedDoctor) {
      return res.status(403).json({ error: 'Unauthorized. You are not a participant in this consultation' });
    }

    // this function will help to create messages
    const newMessage = await prisma.message.create({
      data: {
        consultationId: parseInt(id),
        senderId: userId,
        message: message,
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const consultation = await prisma.consultation.findUnique({
      where: { id: parseInt(id) },
      include: { doctor: true }
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // strict rul only participants can view messages
    const isAssignedPatient = role === 'PATIENT' && consultation.patientId === userId;
    const isAssignedDoctor = role === 'DOCTOR' && consultation.doctor.userId === userId;

    if (!isAssignedPatient && !isAssignedDoctor) {
      return res.status(403).json({ error: 'Unauthorized to view these messages' });
    }

    // strict rule that messages should be returned in chronological order
    const messages = await prisma.message.findMany({
      where: { consultationId: parseInt(id) },
      orderBy: { timestamp: 'asc' }, 
      include: {
        sender: { select: { name: true, role: true } } // Includes sender context for clarity
      }
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sendMessage,
  getMessages
};