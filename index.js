const express = require('express')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Функція для очищення ціни
function cleanPrice(priceText) {
	if (!priceText) return '' // Якщо немає тексту, повертаємо порожній рядок
	const cleanedPrice = priceText.replace(/[^0-9\s]/g, '').trim()
	return cleanedPrice
}

// Функція для парсингу товару
async function scrapeProduct(productId) {
	const browser = await puppeteer.launch({ headless: true })
	const page = await browser.newPage()

	try {
		const searchUrl = `https://allo.ua/ua/catalogsearch/result/?q=${productId}`
		await page.goto(searchUrl, { waitUntil: 'networkidle2' })

		const content = await page.content()
		const $ = cheerio.load(content)
		const firstProductLink = $('.product-card__content a').first().attr('href')

		if (!firstProductLink) {
			return { error: `Товар з ID ${productId} не знайдено.` }
		}

		await page.goto(firstProductLink, { waitUntil: 'networkidle2' })
		const productContent = await page.content()
		const $$ = cheerio.load(productContent)

		const title = $$('.p-view__header-title').text().trim()
		const oldPriceRaw = $$('.p-trade-price__old>.sum').text().trim()
		const newPriceRaw = $$('.p-trade-price__current>.sum').text().trim()
		const image = $$('.main-gallery__link img').attr('src')

		const oldPrice = cleanPrice(oldPriceRaw) + ' ₴'
		const newPrice = cleanPrice(newPriceRaw) + ' ₴'

		return {
			title,
			oldPrice,
			newPrice,
			image,
			productUrl: firstProductLink,
		}
	} catch (error) {
		return {
			error: `Помилка при обробці товару з ID ${productId}: ${error.message}`,
		}
	} finally {
		await browser.close()
	}
}

// Обслуговуємо статичні файли з папки public
app.use(express.static(path.join(__dirname, 'public')))

// Маршрут для API
app.get('/product/:id', async (req, res) => {
	const productId = req.params.id
	const productInfo = await scrapeProduct(productId)

	if (productInfo.error) {
		return res.status(404).json({ error: productInfo.error })
	}

	res.json(productInfo)
})

// Запуск сервера
app.listen(PORT, () => {
	console.log(`Сервер запущено на порті ${PORT}`)
})
