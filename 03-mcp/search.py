import os
import zipfile
import minsearch

BASE_DIR = os.path.dirname(__file__)

# Document sources configuration
DOC_SOURCES = {
    "fastmcp": "fastmcp-main.zip",
    "canvas": "canvas-plugins-main.zip",
}

# Cache for indexes
_index_cache = {}


def load_documents_from_zip(zip_filename):
    """Load md and mdx files from a zip file."""
    zip_path = os.path.join(BASE_DIR, zip_filename)
    documents = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        for name in zf.namelist():
            if name.endswith(".md") or name.endswith(".mdx"):
                # Remove first part of path (e.g., "fastmcp-main/")
                parts = name.split("/", 1)
                if len(parts) > 1:
                    filename = parts[1]
                else:
                    filename = name

                # Skip empty filenames (directories)
                if not filename:
                    continue

                content = zf.read(name).decode("utf-8")
                documents.append({"filename": filename, "content": content})

    return documents


def create_index(source):
    """Create and populate the minsearch index for a source."""
    if source in _index_cache:
        return _index_cache[source]

    zip_file = DOC_SOURCES.get(source)
    if not zip_file:
        raise ValueError(
            f"Unknown source: {source}. Available: {list(DOC_SOURCES.keys())}"
        )

    documents = load_documents_from_zip(zip_file)

    index = minsearch.Index(text_fields=["content", "filename"], keyword_fields=[])
    index.fit(documents)

    _index_cache[source] = index
    return index


def search(query, num_results=5, source="fastmcp"):
    """Search the index and return top results."""
    index = create_index(source)
    results = index.search(query, num_results=num_results)
    return results


if __name__ == "__main__":
    # Test FastMCP search
    print("=== FastMCP docs search for 'demo' ===\n")
    results = search("demo", source="fastmcp")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['filename']}")

    # Test Canvas search
    print("\n=== Canvas Medical docs search for 'patient' ===\n")
    results = search("patient", source="canvas")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['filename']}")
