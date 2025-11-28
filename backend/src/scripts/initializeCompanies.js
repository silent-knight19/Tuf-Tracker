import { initializeDefaultCompanies } from '../services/companyService.js';
import { db } from '../config/firebase.config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runInitialization = async () => {
  console.log('===========================================');
  console.log('Initializing Default Company Requirements');
  console.log('===========================================');
  console.log('');

  try {
    // Load static data
    const dataPath = path.join(__dirname, '../data/defaultCompanyData.json');
    const staticData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Pass static data to the service
    const result = await initializeDefaultCompanies(staticData);
    
    console.log('');
    console.log('===========================================');
    console.log('Initialization Complete');
    console.log('===========================================');
    console.log('');

    result.results.forEach(res => {
      const icon = res.status === 'initialized' || res.status === 'updated' ? '✅' : 
                   res.status === 'already_exists' ? '📦' : '❌';
      console.log(`${icon} ${res.company}: ${res.status}`);
      if (res.error) console.error(`   Error: ${res.error}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
};

runInitialization();
