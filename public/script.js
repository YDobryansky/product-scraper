document.getElementById('productForm').addEventListener('submit', async e => {
	e.preventDefault() // Забороняємо стандартну поведінку форми

	const productId = document.getElementById('productId').value
	const resultDiv = document.getElementById('result')
	resultDiv.innerHTML = '<p>Завантаження...</p>'

	try {
		// Відправляємо запит до API
		const response = await fetch(`/product/${productId}`)
		if (!response.ok) {
			throw new Error(`Помилка: ${response.status}`)
		}

		const data = await response.json()

		if (data.error) {
			resultDiv.innerHTML = `<p class="error">${data.error}</p>`
		} else {
			resultDiv.innerHTML = `
							<h2>${data.title}</h2>
							<p><strong>Стара ціна:</strong> ${data.oldPrice}</p>
							<p><strong>Нова ціна:</strong> ${data.newPrice}</p>
							<img src="${data.image}" alt="${data.title}" />
							<a href="${data.productUrl}" target="_blank">Посилання на товар</a>
					`
		}
	} catch (error) {
		resultDiv.innerHTML = `<p class="error">Помилка: ${error.message}</p>`
	}
})
