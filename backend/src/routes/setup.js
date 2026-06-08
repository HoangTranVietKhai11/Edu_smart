const express = require('express');
const router = express.Router();
const User = require('../models/User');

// TEMPORARY ENDPOINT - DELETE AFTER USE
// Secret key to prevent unauthorized access
const SECRET = 'edusmart_setup_2024_xK9mP';

router.get('/create-admin', async (req, res) => {
  try {
    // Check secret key
    if (req.query.secret !== SECRET) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const adminEmail = 'admin@edusmart.com';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      // Update existing user to admin role
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      return res.json({ 
        success: true, 
        message: 'Updated existing user to admin',
        email: adminEmail,
        password: '(unchanged - use your existing password)'
      });
    }

    // Create new admin
    admin = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: 'Admin@123456',
      role: 'admin',
      isActive: true,
      isFirstLogin: false
    });

    res.json({ 
      success: true, 
      message: 'Admin created successfully!',
      email: adminEmail,
      password: 'Admin@123456'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
