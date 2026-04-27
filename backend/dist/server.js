"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const app_1 = __importDefault(require("./config/app"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const businessRoutes_1 = __importDefault(require("./routes/businessRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const quoteRoutes_1 = __importDefault(require("./routes/quoteRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const auth_1 = require("./middleware/auth");
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const database_1 = require("./config/database");
dotenv_1.default.config({ path: './.env' });
const app = (0, express_1.default)();
(0, app_1.default)(app);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/business', auth_1.authMiddleware, businessRoutes_1.default);
app.use('/api/customers', auth_1.authMiddleware, customerRoutes_1.default);
app.use('/api/products', auth_1.authMiddleware, productRoutes_1.default);
app.use('/api/documents', auth_1.authMiddleware, documentRoutes_1.default);
app.use('/api/quotes', auth_1.authMiddleware, quoteRoutes_1.default);
app.use('/api/settings', auth_1.authMiddleware, settingsRoutes_1.default);
app.use(errorHandler_1.default);
const port = parseInt(process.env.PORT || '8000', 10);
(async () => {
    const connected = await (0, database_1.testDatabaseConnection)();
    if (!connected) {
        process.exit(1);
    }
    app.listen(port, () => {
        console.log(`✅ Backend started at http://localhost:${port}`);
    });
})();
