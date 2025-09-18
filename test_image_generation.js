const OpenAIService = require('./backend/services/openaiService');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

async function testImageGeneration() {
    console.log('🧪 Starting image generation test...');
    
    // Create test folder if it doesn't exist
    const testFolder = path.join(__dirname, 'test');
    if (!fs.existsSync(testFolder)) {
        fs.mkdirSync(testFolder, { recursive: true });
        console.log('📁 Created test folder');
    }

    try {
        // Initialize OpenAI service
        const openaiService = new OpenAIService();
        
        // Test content for image generation
        const testContent = "A beautiful sunset over mountains with vibrant colors";
        const testColor = "orange";
        const testQuality = "high";
        const testStyle = "illustration";
        
        console.log('🎨 Generating test image...');
        console.log(`   Content: "${testContent}"`);
        console.log(`   Color: ${testColor}`);
        console.log(`   Quality: ${testQuality}`);
        console.log(`   Style: ${testStyle}`);
        
        // Generate the image
        const imageUrl = await openaiService.generateImage(testContent, testColor, testQuality, testStyle);
        
        console.log('✅ Image generated successfully!');
        console.log(`   Image URL: ${imageUrl}`);
        
        // Extract filename from URL
        const filename = imageUrl.split('/').pop();
        const sourcePath = path.join(__dirname, 'backend', 'uploads', filename);
        const testPath = path.join(testFolder, `test_${filename}`);
        
        // Copy image to test folder
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, testPath);
            console.log('📋 Image copied to test folder');
            console.log(`   Test file: ${testPath}`);
            
            // Get file stats
            const stats = fs.statSync(testPath);
            console.log(`   File size: ${Math.round(stats.size / 1024)} KB`);
            console.log(`   Created: ${stats.birthtime}`);
            
        } else {
            console.error('❌ Source image file not found:', sourcePath);
        }
        
        console.log('\n🎉 Test completed successfully!');
        console.log(`Check the test folder: ${testFolder}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Check if API key is configured
        if (error.message.includes('API key')) {
            console.log('\n💡 Tip: Make sure your OpenAI API key is set in backend/.env');
            console.log('   OPENAI_API_KEY=your_api_key_here');
        }
        
        process.exit(1);
    }
}

// Run the test
testImageGeneration();
