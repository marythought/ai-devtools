// Default code templates for each language
export const codeTemplates: Record<string, string> = {
  javascript: `const message = "Hello JavaScript!";

function printMessage(msg) {
  console.log(msg);
}

printMessage(message);
const numbers = [1, 2, 3, 4, 5]
const sum = numbers.reduce((a, b) => a + b, 0)
console.log(\`Sum: \${sum}\`);
console.log(\`Average: \${sum / numbers.length}\`)

squares = numbers.map(x => x * x);
console.log(\`Squares: \${squares}\`);
`,

  python: `message = "Hello Python!"

def print_message(msg):
    print(msg)

print_message(message)

numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"Sum: {total}")
print(f"Average: {total / len(numbers)}")

squares = [x**2 for x in numbers]
print(f"Squares: {squares}")
`,

  typescript: `const message: string = "Hello TypeScript!";

function printMessage(): void {
  console.log(message);
}

printMessage();
const numbers: number[] = [1, 2, 3, 4, 5];
const sum: number = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum: \${sum}\`);
console.log(\`Average: \${sum / numbers.length}\`);

const squares: number[] = numbers.map(x => x * x);
console.log(\`Squares: \${squares}\`);

`,

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
