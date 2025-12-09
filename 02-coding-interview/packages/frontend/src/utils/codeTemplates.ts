// Default code templates for each language
export const codeTemplates: Record<string, string> = {
  javascript: `const message = "Hello JavaScript!";

function printMessage(msg) {
  console.log(msg);
}

printMessage(message);`,

  python: `message = "Hello Python!"

def print_message():
    print(message)

print_message()`,

  typescript: `const message: string = "Hello TypeScript!";

function printMessage(): void {
  console.log(message);
}

printMessage();`,

  go: `package main

import "fmt"

func main() {
    message := "Hello Go!"
    printMessage(message)
}

func printMessage(msg string) {
    fmt.Println(msg)
}`,

  java: `public class Main {
    public static void main(String[] args) {
        String message = "Hello Java!";
        printMessage(message);
    }

    public static void printMessage(String msg) {
        System.out.println(msg);
    }
}`,
}

export function getDefaultCode(language: string): string {
  return codeTemplates[language.toLowerCase()] || codeTemplates.javascript
}
