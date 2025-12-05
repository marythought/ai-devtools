# Code Execution Test Examples

Use these code snippets to test the code execution feature in different languages.

## JavaScript

```javascript
console.log("Hello from JavaScript!")
const numbers = [1, 2, 3, 4, 5]
const sum = numbers.reduce((a, b) => a + b, 0)
console.log(`Sum: ${sum}`)
console.log(`Average: ${sum / numbers.length}`)
```

## TypeScript

```typescript
interface Person {
  name: string
  age: number
}

const person: Person = {
  name: "Alice",
  age: 30
}

console.log(`Hello, ${person.name}!`)
console.log(`You are ${person.age} years old`)
```

## Python

```python
print("Hello from Python!")
numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"Sum: {total}")
print(f"Average: {total / len(numbers)}")

# List comprehension
squares = [x**2 for x in numbers]
print(f"Squares: {squares}")
```

## Java

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");

        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;

        for (int num : numbers) {
            sum += num;
        }

        System.out.println("Sum: " + sum);
        System.out.println("Average: " + (sum / numbers.length));
    }
}
```

## Go

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")

    numbers := []int{1, 2, 3, 4, 5}
    sum := 0

    for _, num := range numbers {
        sum += num
    }

    fmt.Printf("Sum: %d\n", sum)
    fmt.Printf("Average: %d\n", sum/len(numbers))
}
```

## Rust

```rust
fn main() {
    println!("Hello from Rust!");

    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();

    println!("Sum: {}", sum);
    println!("Average: {}", sum / numbers.len() as i32);
}
```

## C++

```cpp
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from C++!" << std::endl;

    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);

    std::cout << "Sum: " << sum << std::endl;
    std::cout << "Average: " << sum / numbers.size() << std::endl;

    return 0;
}
```

## Testing Error Handling

### Syntax Error (Python)
```python
print("Missing closing quote)
```

### Runtime Error (JavaScript)
```javascript
function divide(a, b) {
  return a / b
}

console.log(divide(10, 0)) // Infinity in JS
throw new Error("This is a test error")
```

### Timeout Test (Python)
```python
import time
print("Starting long operation...")
time.sleep(10)  # Will timeout after 5 seconds
print("This won't print")
```

## Expected Behavior

### Security Features
- **Network isolation**: No network access (--network=none)
- **Resource limits**: 128MB memory, 0.5 CPU
- **Execution timeout**: 5-15 seconds depending on language
- **Read-only filesystem**: Cannot modify files outside /tmp
- **Code validation**: Blocks dangerous patterns (eval, exec, subprocess)

### Performance
- JavaScript/Python: ~5 second timeout
- TypeScript/Java/Go: ~10 second timeout
- Rust/C++: ~15 second timeout (compilation time)

## How to Test

1. Open http://localhost:5173
2. Create a new session
3. Select a language from the dropdown
4. Paste one of the code examples above
5. Click "Run Code" or press Cmd/Ctrl + Enter
6. Check the output panel for results

## Troubleshooting

If code execution fails:

1. **Check Docker is running**:
   ```bash
   docker ps
   ```

2. **Pull required Docker images**:
   ```bash
   docker pull node:20-alpine
   docker pull python:3.11-alpine
   docker pull openjdk:17-alpine
   docker pull golang:1.21-alpine
   docker pull rust:1.75-alpine
   docker pull gcc:13-alpine
   ```

3. **Check Docker permissions**:
   ```bash
   docker run --rm node:20-alpine echo "Docker is working"
   ```

4. **Check backend logs** in the terminal running `npm run dev`
