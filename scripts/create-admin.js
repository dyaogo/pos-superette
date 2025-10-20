const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await prisma.user.create({
      data: {
        email: "admin@superette.com",
        username: "admin",
        password: hashedPassword,
        fullName: "Administrateur",
        role: "admin",
        isActive: true,
      },
    });

    console.log("✅ Admin créé avec succès:", admin);
    console.log("📧 Email: admin@superette.com");
    console.log("🔑 Mot de passe: admin123");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
