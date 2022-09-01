const cron = require('node-cron')
const puppeteer = require('puppeteer')
const dotenv = require('dotenv')

// Allow pulling ENV variable from .env file
dotenv.config()

const accountSid = process.env.TWILIO_ACCOUNT_SID || ''
const authToken = process.env.TWILIO_AUTH_TOKEN || ''
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER || ''
const toPhoneNumber = process.env.PERSONAL_PHONE_NUMBER || ''
const client = require('twilio')(accountSid, authToken)


cron.schedule('* 6-23 * * *', async function() {
  console.log("---------------------------")
  console.log(`Checking Raspberry Pi Stock: ${new Date()}`)
	let browser
	try {
		// Create Browser
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox']
		})

		// Get Data
		const stockStatus = await checkStock(browser)
		console.log("stockStatus: ", stockStatus)
		if (stockStatus) await sendSMS(`Raspberry Pi Boards In Stock! Check ASAP at https://rpilocator.com/?country=US`)

		console.log("Closing browser")
		await browser.close()
		
		return
	} catch(err) {
		console.log(`checkStock failed: ${err}`)
		console.log("Closing browser")
		if (browser) 
			await browser.close().catch(() => console.log("Browser close failure. Browser was never opened."))
		return res.status(500).json(`checkStock failed: ${err}`)
	}
});

const checkStock = async (browser) => {
    console.log("In checkStock Function")
    try {
      let page = await browser.newPage();
      await page.setViewport({width: 1920, height: 1080})
      await page.goto('https://rpilocator.com/?country=US')
      await page.waitForSelector('td[class="sorting_1"]', {timeout: 30000}).catch((err) => console.log(`STEP 1: ${err.message}`))
      const stockOptions = await page.$$('td[class="sorting_1"]')
      for(let i = 0; i < stockOptions.length; i++) {
        const text = await getTextContent(stockOptions[i])
        if (text === 'Yes') return true
      }
      return false
    } catch (err) {
      console.log(`checkStock Function Failed: ${err}`)
      throw err
    }
}

const sendSMS = async (message) => {
    const response = await client.messages.create({
       body: message,
       from: fromPhoneNumber,
       to: toPhoneNumber
     })
     if (response.status === 'queued') return
     else throw new Error("Message failed to send")
}


const getTextContent = async (property) => { // TODO - use property type
    return await (await property.getProperty('textContent')).jsonValue()
}