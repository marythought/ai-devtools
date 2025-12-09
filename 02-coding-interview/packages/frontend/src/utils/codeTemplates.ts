// Default code templates for each language
export const codeTemplates: Record<string, string> = {
  javascript: `const message = "Hello World!";

function printMessage() {
  console.log(message);
}

printMessage();`,

  python: `message = "Hello World!"

def print_message():
    print(message)

print_message()`,

  typescript: `const message: string = "Hello World!";

function printMessage(): void {
  console.log(message);
}

printMessage();`,

  go: `package main

import "fmt"

func main() {
    message := "Hello World!"
    printMessage(message)
}

func printMessage(msg string) {
    fmt.Println(msg)
}`,
}

export function getDefaultCode(language: string): string {
  return codeTemplates[language.toLowerCase()] || codeTemplates.javascript
}
