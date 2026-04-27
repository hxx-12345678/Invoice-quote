"use strict";
// prisma/seed.ts
// Database seed script for demo data
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.documentItem.deleteMany();
    await prisma.taxBreakdown.deleteMany();
    await prisma.document.deleteMany();
    await prisma.quoteItem.deleteMany();
    await prisma.quoteActivityLog.deleteMany();
    await prisma.quoteVersion.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.product.deleteMany();
    await prisma.address.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.bankDetail.deleteMany();
    await prisma.invoiceTemplate.deleteMany();
    await prisma.businessProfile.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.apiToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    // Create test user
    console.log('👤 Creating test user...');
    const hashedPassword = await bcryptjs_1.default.hash('password123', 12);
    const user = await prisma.user.create({
        data: {
            email: 'test@quotiq.com',
            password: hashedPassword,
            name: 'Quotiq Test User',
            settings: {
                create: {
                    currency: 'INR',
                    taxSystem: 'GST',
                    defaultTaxRate: 18,
                    invoicePrefix: 'INV',
                    invoiceCurrentNumber: 1000,
                    quotePrefix: 'QT',
                    quoteCurrentNumber: 100,
                    timezone: 'Asia/Kolkata',
                    dateFormat: 'DD/MM/YYYY',
                    numberFormat: 'en-IN',
                },
            },
        },
    });
    console.log(`✅ Test user created: ${user.email}`);
    // Create the requested user
    console.log('👤 Creating cptjacksprw user...');
    const jackHashedPassword = await bcryptjs_1.default.hash('Player@123', 12);
    const jackUser = await prisma.user.create({
        data: {
            email: 'cptjacksprw@gmail.com',
            password: jackHashedPassword,
            name: 'Captain Jack Sparrow',
            settings: {
                create: {
                    currency: 'INR',
                    taxSystem: 'GST',
                    defaultTaxRate: 18,
                    invoicePrefix: 'INV',
                    invoiceCurrentNumber: 1000,
                    quotePrefix: 'QT',
                    quoteCurrentNumber: 100,
                    timezone: 'Asia/Kolkata',
                    dateFormat: 'DD/MM/YYYY',
                    numberFormat: 'en-IN',
                },
            },
        },
    });
    console.log(`✅ Requested user created: ${jackUser.email}`);
    // Create business profile for test user
    console.log('🏢 Creating business profile for test user...');
    const businessProfile = await prisma.businessProfile.create({
        data: {
            userId: user.id,
            businessType: 'private_limited',
            businessName: 'Quotiq Solutions',
            legalName: 'Quotiq Solutions Pvt Ltd',
            registrationNumber: 'ROC/2024/QTQ123',
            taxId: '27AABCT1234H1Z0',
            panNumber: 'AABCT1234H',
            country: 'India',
            state: 'Tamil Nadu',
            city: 'Chennai',
            address: '123 Business Park, Anna Nagar',
            pincode: '600040',
            email: 'info@quotiq.com',
            phone: '+91-98765-43210',
            website: 'https://quotiq.com',
            bankDetails: {
                create: [
                    {
                        bankName: 'HDFC Bank',
                        accountNumber: '1234567890',
                        ifscCode: 'HDFC0000001',
                        accountHolderName: 'Quotiq Solutions Pvt Ltd',
                        branch: 'Anna Nagar',
                        isDefault: true,
                    },
                ],
            },
        },
    });
    console.log(`✅ Business profile created`);
    // Create business profile for jackUser
    console.log('🏢 Creating business profile for jackUser...');
    await prisma.businessProfile.create({
        data: {
            userId: jackUser.id,
            businessType: 'individual',
            businessName: 'Black Pearl Trading Co.',
            legalName: 'Captain Jack Sparrow',
            taxId: '27AABCT9999H1Z0',
            panNumber: 'AABCT9999H',
            country: 'India',
            state: 'Goa',
            city: 'Panjim',
            address: 'Pier 7, Port Royal',
            pincode: '403001',
            email: 'cptjacksprw@gmail.com',
            phone: '+91-99999-88888',
            website: 'https://blackpearl.com',
            bankDetails: {
                create: [
                    {
                        bankName: 'Royal Bank of Tortuga',
                        accountNumber: '9876543210',
                        ifscCode: 'TORT0000001',
                        accountHolderName: 'Jack Sparrow',
                        branch: 'Treasure Cove',
                        isDefault: true,
                    },
                ],
            },
        },
    });
    console.log(`✅ Jack's business profile created`);
    // Create sample customers
    console.log('👥 Creating sample customers...');
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                userId: user.id,
                businessProfileId: businessProfile.id,
                name: 'Acme Corporation',
                companyName: 'Acme Corp Ltd',
                email: 'contact@acme.com',
                phone: '+91-99999-11111',
                addresses: {
                    create: [
                        {
                            type: 'billing',
                            street: '456 Corporate Avenue',
                            city: 'Bangalore',
                            state: 'Karnataka',
                            country: 'India',
                            pincode: '560001',
                            isDefault: true,
                        },
                        {
                            type: 'shipping',
                            street: '789 Industrial Park',
                            city: 'Bangalore',
                            state: 'Karnataka',
                            country: 'India',
                            pincode: '560096',
                            isDefault: true,
                        },
                    ],
                },
                taxId: '29AABCU1234H1Z0',
                currency: 'INR',
                paymentTerms: 'net_30',
            },
        }),
        prisma.customer.create({
            data: {
                userId: user.id,
                businessProfileId: businessProfile.id,
                name: 'John Smith',
                email: 'john@example.com',
                phone: '+91-98765-54321',
                addresses: {
                    create: [
                        {
                            type: 'billing',
                            street: '321 Main Street',
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            country: 'India',
                            pincode: '400001',
                            isDefault: true,
                        },
                    ],
                },
                currency: 'INR',
                paymentTerms: 'net_15',
            },
        }),
    ]);
    console.log(`✅ ${customers.length} customers created`);
    // Create sample products
    console.log('📦 Creating sample products...');
    const products = await Promise.all([
        prisma.product.create({
            data: {
                userId: user.id,
                businessProfileId: businessProfile.id,
                name: 'Software Development Services',
                description: 'Custom software development per hour',
                sku: 'SVC-001',
                unitPrice: 150,
                unit: 'hrs',
                taxRate: 18,
                taxType: 'IGST',
                category: 'Services',
                isService: true,
                isActive: true,
            },
        }),
        prisma.product.create({
            data: {
                userId: user.id,
                businessProfileId: businessProfile.id,
                name: 'Business Consultation',
                description: 'Expert business consultation services',
                sku: 'CONS-001',
                hsnCode: '998300',
                unitPrice: 200,
                unit: 'days',
                taxRate: 18,
                taxType: 'IGST',
                category: 'Services',
                isService: true,
                isActive: true,
            },
        }),
        prisma.product.create({
            data: {
                userId: user.id,
                businessProfileId: businessProfile.id,
                name: 'Server Hardware',
                description: 'Enterprise-grade server equipment',
                sku: 'HW-001',
                hsnCode: '847180',
                unitPrice: 5000,
                unit: 'pcs',
                taxRate: 5,
                taxType: 'IGST',
                category: 'Hardware',
                isService: false,
                isActive: true,
                stockQuantity: 10,
                lowStockThreshold: 2,
            },
        }),
    ]);
    console.log(`✅ ${products.length} products created`);
    console.log('✨ Database seed completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log(`   Email: test@invoiceflow.com`);
    console.log(`   Password: password123`);
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
