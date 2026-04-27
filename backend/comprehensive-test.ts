import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const TEST_USER = {
  email: 'cptjacksprw@gmail.com',
  password: 'Player@123'
};

interface TestResult {
  passed: boolean;
  message: string;
  error?: any;
}

class TestRunner {
  private token = '';
  private businessProfileId = '';
  private customerId = '';
  private productId = '';
  private invoiceId = '';
  private proformaId = '';
  private creditNoteId = '';
  private quoteId = '';
  private timestamp = Date.now();

  private results: TestResult[] = [];

  private log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  private addResult(passed: boolean, message: string, error?: any) {
    this.results.push({ passed, message, error });
    this.log(`${passed ? '✅' : '❌'} ${message}`);
    if (error) console.error(error);
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive API Test Suite...\n');

    try {
      await this.testAuth();
      await this.testBusiness();
      await this.testCustomers();
      await this.testProducts();
      await this.testQuotes();
      await this.testDocuments();

      this.printSummary();
    } catch (error) {
      this.log(`💥 Test suite failed: ${error}`);
    }
  }

  private async testAuth() {
    this.log('\n🔐 Testing Authentication...');

    try {
      const res = await axios.post(`${API_URL}/auth/login`, TEST_USER);
      this.token = res.data.data.token;
      this.addResult(true, 'Login successful');
    } catch (error: any) {
      this.addResult(false, 'Login failed', error.response?.data || error.message);
    }
  }

  private async testBusiness() {
    this.log('\n🏢 Testing Business Profile...');

    const headers = { Authorization: `Bearer ${this.token}` };

    try {
      // Get business profile
      const getRes = await axios.get(`${API_URL}/business`, { headers });
      this.businessProfileId = getRes.data.data.id;
      this.addResult(true, 'Fetched business profile');

      // Update business profile
      const updateData = {
        businessName: 'Quotiq Enterprise Solutions',
        address: '123 Tech Avenue, Bangalore, India'
      };
      await axios.put(`${API_URL}/business`, updateData, { headers });
      this.addResult(true, 'Updated business profile');
    } catch (error: any) {
      this.addResult(false, 'Business profile test failed', error.response?.data || error.message);
    }
  }

  private async testCustomers() {
    this.log('\n👥 Testing Customers...');

    const headers = { Authorization: `Bearer ${this.token}` };

    try {
      // Create customer
      const customerData = {
        businessProfileId: this.businessProfileId,
        name: 'Acme Corp International',
        email: `contact${this.timestamp}@acmecorp.com`,
        phone: '+1-555-0123',
        currency: 'USD',
        taxId: 'US123456789'
      };
      const createRes = await axios.post(`${API_URL}/customers`, customerData, { headers });
      this.customerId = createRes.data.data.id;
      this.addResult(true, 'Created customer');

      // Get all customers
      await axios.get(`${API_URL}/customers?businessProfileId=${this.businessProfileId}`, { headers });
      this.addResult(true, 'Fetched customers');

      // Update customer
      await axios.put(`${API_URL}/customers/${this.customerId}`, { name: 'Acme Corp International Updated' }, { headers });
      this.addResult(true, 'Updated customer');

      // Get customer by ID
      await axios.get(`${API_URL}/customers/${this.customerId}`, { headers });
      this.addResult(true, 'Fetched customer by ID');

    } catch (error: any) {
      this.addResult(false, 'Customer test failed', error.response?.data || error.message);
    }
  }

  private async testProducts() {
    this.log('\n📦 Testing Products...');

    const headers = { Authorization: `Bearer ${this.token}` };

    try {
      // Create product
      const productData = {
        businessProfileId: this.businessProfileId,
        name: 'Enterprise Software License',
        description: 'Annual software license for enterprise use',
        sku: `ESL-${this.timestamp}`,
        unitPrice: 5000,
        unit: 'license',
        hsnCode: '998314',
        taxRate: 18
      };
      const createRes = await axios.post(`${API_URL}/products`, productData, { headers });
      this.productId = createRes.data.data.id;
      this.addResult(true, 'Created product');

      // Get all products
      await axios.get(`${API_URL}/products?businessProfileId=${this.businessProfileId}`, { headers });
      this.addResult(true, 'Fetched products');

      // Update product
      await axios.put(`${API_URL}/products/${this.productId}`, { price: 5500 }, { headers });
      this.addResult(true, 'Updated product');

    } catch (error: any) {
      this.addResult(false, 'Product test failed', error.response?.data || error.message);
    }
  }

  private async testQuotes() {
    this.log('\n📄 Testing Quotes...');

    const headers = { Authorization: `Bearer ${this.token}` };

    try {
      // Create quote
      const quoteData = {
        businessProfileId: this.businessProfileId,
        customerId: this.customerId,
        quoteNumber: `Q-${this.timestamp}`,
        issueDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: 'USD',
        subtotal: 4500,
        grandTotal: 5310,
        shareToken: `share-token-${this.timestamp}`,
        items: [{
          productId: this.productId,
          name: 'Enterprise Software License',
          quantity: 10,
          unit: 'license',
          unitPrice: 5000,
          discountPercent: 5,
          taxRate: 18,
          totalBeforeTax: 47500,
          totalAfterTax: 47500
        }],
        notes: 'Special enterprise pricing'
      };
      const createRes = await axios.post(`${API_URL}/quotes`, quoteData, { headers });
      this.quoteId = createRes.data.data.id;
      this.addResult(true, 'Created quote');

      // Get all quotes
      await axios.get(`${API_URL}/quotes?businessProfileId=${this.businessProfileId}`, { headers });
      this.addResult(true, 'Fetched quotes');

      // Update quote
      await axios.put(`${API_URL}/quotes/${this.quoteId}`, { status: 'sent' }, { headers });
      this.addResult(true, 'Updated quote');

    } catch (error: any) {
      this.addResult(false, 'Quote test failed', error.response?.data || error.message);
    }
  }

  private async testDocuments() {
    this.log('\n📋 Testing Documents (Invoices, Proforma, Credit Notes)...');

    const headers = { Authorization: `Bearer ${this.token}` };

    try {
      // Create Invoice
      const invoiceData = {
        businessProfileId: this.businessProfileId,
        customerId: this.customerId,
        type: 'invoice',
        documentNumber: `INV-${this.timestamp}`,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: 'USD',
        items: [{
          name: 'Enterprise Software License',
          quantity: 5,
          unit: 'license',
          unitPrice: 5000,
          discountPercent: 0,
          taxType: 'GST',
          taxRate: 18,
          totalBeforeTax: 25000,
          totalAfterTax: 25000
        }],
        subtotal: 25000,
        taxTotal: 4500,
        grandTotal: 29500,
        amountDue: 29500
      };
      const createInvRes = await axios.post(`${API_URL}/documents`, invoiceData, { headers });
      this.invoiceId = createInvRes.data.data.id;
      this.addResult(true, 'Created invoice');

      // Create Proforma Invoice
      const proformaData = {
        ...invoiceData,
        type: 'proforma',
        documentNumber: `PRO-${this.timestamp}`
      };
      const createProRes = await axios.post(`${API_URL}/documents`, proformaData, { headers });
      this.proformaId = createProRes.data.data.id;
      this.addResult(true, 'Created proforma invoice');

      // Create Credit Note
      const creditNoteData = {
        businessProfileId: this.businessProfileId,
        customerId: this.customerId,
        type: 'credit_note',
        documentNumber: `CN-${this.timestamp}`,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: 'USD',
        referenceNumber: this.invoiceId, // Linked to original invoice
        items: [{
          name: 'Credit for returned license',
          quantity: 1,
          unit: 'license',
          unitPrice: -5000, // Negative for credit
          discountPercent: 0,
          taxType: 'GST',
          taxRate: 18,
          totalBeforeTax: -5000,
          totalAfterTax: -5000
        }],
        subtotal: -5000,
        taxTotal: -900,
        grandTotal: -5900,
        amountDue: -5900,
        notes: 'Credit for returned software license due to compatibility issues'
      };
      const createCNRes = await axios.post(`${API_URL}/documents`, creditNoteData, { headers });
      this.creditNoteId = createCNRes.data.data.id;
      this.addResult(true, 'Created credit note');

      // Get all documents
      await axios.get(`${API_URL}/documents?businessProfileId=${this.businessProfileId}`, { headers });
      this.addResult(true, 'Fetched all documents');

      // Get documents by type
      await axios.get(`${API_URL}/documents?businessProfileId=${this.businessProfileId}&type=invoice`, { headers });
      this.addResult(true, 'Fetched invoices');

      await axios.get(`${API_URL}/documents?businessProfileId=${this.businessProfileId}&type=proforma`, { headers });
      this.addResult(true, 'Fetched proforma invoices');

      await axios.get(`${API_URL}/documents?businessProfileId=${this.businessProfileId}&type=credit_note`, { headers });
      this.addResult(true, 'Fetched credit notes');

      // Update document status
      await axios.put(`${API_URL}/documents/${this.invoiceId}`, { status: 'sent' }, { headers });
      this.addResult(true, 'Updated invoice status');

    } catch (error: any) {
      this.addResult(false, 'Document test failed', error.response?.data || error.message);
    }
  }

  private async testPayments() {
    // Payments not implemented yet
  }

  private printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => console.log(`  - ${r.message}`));
    }

    console.log('\n' + (passed === total ? '🎉 All tests passed!' : '⚠️  Some tests failed. Check logs above.'));
  }
}

// Run the tests
const runner = new TestRunner();
runner.runAllTests().catch(console.error);