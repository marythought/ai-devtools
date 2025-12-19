from main import scrape_web

url = "https://github.com/alexeygrigorev/minsearch"
content = scrape_web(url)

print(f"Content length: {len(content)} characters")
print("\n--- Content Preview ---\n")
print(content[:500])
