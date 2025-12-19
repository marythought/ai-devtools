import requests
from fastmcp import FastMCP
from search import search as search_docs

mcp = FastMCP("Demo 🚀")


@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b


def scrape_web(url: str) -> str:
    """Scrape web page content using Jina Reader and return it as markdown."""
    jina_url = f"https://r.jina.ai/{url}"
    response = requests.get(jina_url)
    response.raise_for_status()
    return response.text


def search_fastmcp_docs(query: str) -> str:
    """Search FastMCP documentation. Returns the top 5 most relevant documents."""
    results = search_docs(query, num_results=5, source="fastmcp")
    output = []
    for result in results:
        output.append(f"## {result['filename']}\n\n{result['content']}\n")
    return "\n---\n".join(output)


def search_canvas_docs(query: str) -> str:
    """Search Canvas Medical SDK documentation. Returns the top 5 most relevant documents."""
    results = search_docs(query, num_results=5, source="canvas")
    output = []
    for result in results:
        output.append(f"## {result['filename']}\n\n{result['content']}\n")
    return "\n---\n".join(output)


mcp.tool(scrape_web)
mcp.tool(search_fastmcp_docs)
mcp.tool(search_canvas_docs)


if __name__ == "__main__":
    mcp.run()
