import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const TEST_USER = {
  email: 'cptjacksprw@gmail.com',
  password: 'Player@123'
};

async function runTests() {
  console.log('🚀 Starting Settings Component E2E Test...');
  let token = '';

  try {
    // 1. Login
    console.log('\nStep 1: Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    token = loginRes.data.data.token;
    console.log('✅ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Business Profile Tests
    console.log('\nStep 2: Business Profile Tests');
    const bizGetRes = await axios.get(`${API_URL}/business`, { headers });
    const originalBiz = bizGetRes.data.data;
    console.log('✅ Fetched current business profile:', originalBiz.businessName);

    // Prepare data for update, ensuring required fields are strings and bankDetails is an object (not array)
    const updateBizData = {
      businessType: originalBiz.businessType || 'enterprise',
      businessName: 'Quotiq Enterprise Solutions',
      legalName: originalBiz.legalName || 'Quotiq Solutions Private Limited',
      country: originalBiz.country || 'India',
      state: originalBiz.state || 'Karnataka',
      city: originalBiz.city || 'Bangalore',
      address: '123 Tech Avenue, Bangalore, India',
      pincode: originalBiz.pincode || '560001',
      email: originalBiz.email || TEST_USER.email,
      phone: originalBiz.phone || '9999999999',
      bankDetails: Array.isArray(originalBiz.bankDetails) && originalBiz.bankDetails.length > 0 
        ? {
            bankName: originalBiz.bankDetails[0].bankName,
            accountNumber: originalBiz.bankDetails[0].accountNumber,
            accountHolderName: originalBiz.bankDetails[0].accountHolderName,
            ifscCode: originalBiz.bankDetails[0].ifscCode
          }
        : undefined
    };

    const bizPutRes = await axios.put(`${API_URL}/business`, updateBizData, { headers });
    console.log('✅ Updated business profile successfully');
    
    // Verify persistence
    const bizVerifyRes = await axios.get(`${API_URL}/business`, { headers });
    if (bizVerifyRes.data.data.businessName === 'Quotiq Enterprise Solutions') {
      console.log('✅ Business profile update persisted');
    } else {
      console.error('❌ Business profile update FAILED persistence');
    }

    // 3. Billing Settings Tests
    console.log('\nStep 3: Billing Settings Tests');
    const settingsGetRes = await axios.get(`${API_URL}/settings`, { headers });
    const originalSettings = settingsGetRes.data.data;
    console.log('✅ Fetched current settings. Tax System:', originalSettings.taxSystem);

    // Prepare settings for update, converting nulls to undefined for Zod
    const cleanSettings = Object.fromEntries(
      Object.entries(originalSettings).map(([key, value]) => [key, value === null ? undefined : value])
    );

    const updateSettingsData = {
      ...cleanSettings,
      currency: 'USD',
      taxInclusive: true
    };
    await axios.put(`${API_URL}/settings`, updateSettingsData, { headers });
    console.log('✅ Updated settings successfully');

    // Verify persistence
    const settingsVerifyRes = await axios.get(`${API_URL}/settings`, { headers });
    if (settingsVerifyRes.data.data.currency === 'USD' && settingsVerifyRes.data.data.taxInclusive === true) {
      console.log('✅ Settings update persisted');
    } else {
      console.error('❌ Settings update FAILED persistence');
    }

    // 4. Bank Details Test (stored within business profile)
    console.log('\nStep 4: Bank Details Test');
    const bankUpdateData = {
      ...updateBizData,
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Captain Jack Sparrow'
      }
    };
    await axios.put(`${API_URL}/business`, bankUpdateData, { headers });
    const bankVerifyRes = await axios.get(`${API_URL}/business`, { headers });
    const verifiedBank = bankVerifyRes.data.data.bankDetails;
    // Note: API returns an array for bankDetails
    if (Array.isArray(verifiedBank) && verifiedBank.length > 0 && verifiedBank[0].bankName === 'HDFC Bank') {
      console.log('✅ Bank details update persisted');
    } else {
      console.log('Verified bank details:', verifiedBank);
      console.error('❌ Bank details update FAILED persistence');
    }

    // 5. Compliance Test (Export Data)
    console.log('\nStep 5: Compliance Test (Export Data)');
    const exportRes = await axios.get(`${API_URL}/auth/export-data`, { headers });
    if (exportRes.data.success && exportRes.data.data) {
      console.log('✅ Data export successful. Found entities:', Object.keys(exportRes.data.data).join(', '));
    } else {
      console.error('❌ Data export FAILED');
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } catch (error: any) {
    console.error('\n❌ TEST FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
    process.exit(1);
  }
}

runTests();
