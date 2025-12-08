import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Patient from '../models/patient.model.js';
import Role from '../models/role.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careflow-ehr';

async function seedTestUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get roles
    const doctorRole = await Role.findOne({ name: 'doctor' });
    const patientRole = await Role.findOne({ name: 'patient' });
    const nurseRole = await Role.findOne({ name: 'nurse' });
    const secretaryRole = await Role.findOne({ name: 'secretary' });
    const pharmacistRole = await Role.findOne({ name: 'pharmacist' });
    const labTechRole = await Role.findOne({ name: 'lab_technician' });

    if (!doctorRole || !patientRole) {
      console.error('❌ Roles not found. Run the app first to seed roles.');
      process.exit(1);
    }

    // Test users to create
    const testUsers = [
      {
        email: 'doctor@careflow.com',
        password: 'Doctor@123456',
        firstName: 'John',
        lastName: 'Smith',
        role: doctorRole._id,
        specialization: 'General Medicine',
        licenseNumber: 'MD-12345',
        isActive: true
      },
      {
        email: 'nurse@careflow.com',
        password: 'Nurse@123456',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: nurseRole._id,
        isActive: true
      },
      {
        email: 'secretary@careflow.com',
        password: 'Secretary@123456',
        firstName: 'Emily',
        lastName: 'Davis',
        role: secretaryRole._id,
        isActive: true
      },
      {
        email: 'pharmacist@careflow.com',
        password: 'Pharmacist@123456',
        firstName: 'Michael',
        lastName: 'Brown',
        role: pharmacistRole._id,
        isActive: true
      },
      {
        email: 'labtech@careflow.com',
        password: 'LabTech@123456',
        firstName: 'David',
        lastName: 'Wilson',
        role: labTechRole._id,
        isActive: true
      },
      {
        email: 'patient@careflow.com',
        password: 'Patient@123456',
        firstName: 'Alice',
        lastName: 'Williams',
        role: patientRole._id,
        isActive: true
      }
    ];

    console.log('\n📝 Creating test users...\n');

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await User.create(userData);
      const roleName = (await Role.findById(userData.role)).name;
      
      console.log(`✅ Created ${roleName}: ${userData.email} / ${userData.password}`);

      // If patient role, also create a Patient record
      if (roleName === 'patient') {
        const existingPatient = await Patient.findOne({ user: user._id });
        if (!existingPatient) {
          await Patient.create({
            user: user._id,
            dateOfBirth: new Date('1990-05-15'),
            gender: 'female',
            bloodType: 'A+',
            phone: '+1234567890',
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            },
            emergencyContact: {
              name: 'Bob Williams',
              relationship: 'Spouse',
              phone: '+1234567891'
            }
          });
          console.log(`   └─ Created Patient record for ${userData.email}`);
        }
      }
    }

    console.log('\n========================================');
    console.log('🎉 TEST ACCOUNTS CREATED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('You can now login with these accounts:\n');
    console.log('👨‍⚕️ DOCTOR:     doctor@careflow.com     / Doctor@123456');
    console.log('👩‍⚕️ NURSE:      nurse@careflow.com      / Nurse@123456');
    console.log('📋 SECRETARY:  secretary@careflow.com  / Secretary@123456');
    console.log('💊 PHARMACIST: pharmacist@careflow.com / Pharmacist@123456');
    console.log('🔬 LAB TECH:   labtech@careflow.com    / LabTech@123456');
    console.log('🏥 PATIENT:    patient@careflow.com    / Patient@123456');
    console.log('\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();
