# Creating Topics with Markdown - Developer Guide

## Overview

Topics are now fully markdown-based. You write content in `.md` files with full styling support, and they render beautifully in the UI with syntax-highlighted code blocks, tables, links, and more.

## File Structure

```
src/data/topics/
├── java.js                              ← Metadata (slug, title, summary, tags)
├── java/
│   ├── optional/
│   │   └── content.md                   ← Full markdown content
│   ├── streams/
│   │   └── content.md
│   └── records/
│       └── content.md
├── javascript.js                        ← Another category
├── javascript/
│   ├── promises/
│   │   └── content.md
│   └── event-loop/
│       └── content.md
└── ...
```

## Step-by-Step: Adding a New Topic

### 1. Update the category metadata file

Edit `src/data/topics/java.js`:

```javascript
const javaTopics = [
  {
    slug: 'streams',                    // ← unique ID (URL: /content/java/streams)
    title: 'Java Streams',              // ← displayed as page heading
    summary: 'Functional-style operations on collections.',
    tags: ['java', 'collections', 'functional'],  // ← searchable
    gifUrl: null,                       // ← optional demo GIF/image
    relatedTool: 'java-formatter',      // ← link to a tool (optional)
    body: '',                           // ← always empty - content comes from .md file
  },
  // Add your new topic here ↓
  {
    slug: 'generics',
    title: 'Java Generics',
    summary: 'Type-safe collections and methods with generic types.',
    tags: ['java', 'types', 'collections'],
    gifUrl: null,
    relatedTool: null,
    body: '',
  },
];

export default javaTopics;
```

### 2. Create the markdown content file

Create `src/data/topics/java/generics/content.md`:

```markdown
# Java Generics

## Overview

Generics allow you to write reusable code that works with different data types...

## Why Use Generics?

- **Type Safety**: Errors at compile-time, not runtime
- **No Casting**: No need to cast objects after retrieval
- **Better Performance**: Less boxing/unboxing

## Basic Syntax

```java
List<String> names = new ArrayList<>();
names.add("Alice");
String first = names.get(0);  // No casting needed
```

## Type Parameters

### Single Type Parameter

```java
public class Container<T> {
  private T value;
  
  public void set(T value) {
    this.value = value;
  }
  
  public T get() {
    return value;
  }
}

// Usage
Container<String> stringContainer = new Container<>();
stringContainer.set("Hello");
```

### Multiple Type Parameters

```java
public class Pair<K, V> {
  private K key;
  private V value;
  
  public Pair(K key, V value) {
    this.key = key;
    this.value = value;
  }
  
  // getters...
}

// Usage
Pair<String, Integer> pair = new Pair<>("age", 25);
```

## Bounded Type Parameters

### Upper Bound

```java
// T must be a Number or subclass
public class NumberProcessor<T extends Number> {
  public double processArray(T[] array) {
    double sum = 0;
    for (T num : array) {
      sum += num.doubleValue();
    }
    return sum;
  }
}
```

### Lower Bound (Wildcards)

```java
// Accepts List of Integer or any superclass of Integer
public void addNumbers(List<? super Integer> list) {
  list.add(42);
}
```

## Wildcards

### Unbounded Wildcard

```java
public void printList(List<?> list) {
  for (Object item : list) {
    System.out.println(item);
  }
}
```

### Covariance and Contravariance

```java
// Covariant (extends) - for reading
List<? extends Number> numbers = new ArrayList<Integer>();

// Contravariant (super) - for writing
List<? super Integer> integers = new ArrayList<Number>();
```

## Common Pitfalls

⚠️ **Type Erasure**

Generics are erased at runtime. This doesn't work:

```java
// DON'T DO THIS
if (list instanceof List<String>) { }  // Compile error
```

Instead, use:

```java
if (list instanceof List) { }
// Or check contents manually
```

⚠️ **No Primitives**

Generics only work with objects:

```java
// DON'T DO THIS
List<int> numbers;  // Compile error

// DO THIS
List<Integer> numbers;  // Autoboxing handles conversion
```

## Best Practices

✅ **Use generics for:**
- Collections (List, Set, Map)
- Custom generic classes
- Generic methods
- Improving API clarity

✅ **Tips:**
- Name type parameters clearly (T, K, V, E instead of A, B, C)
- Use bounded types when you need specific behavior
- Prefer wildcards in method signatures for flexibility

## Resources

- [Java Generics Official Docs](https://docs.oracle.com/javase/tutorial/java/generics/)
- [PECS: Producers Extend, Consumers Super](https://stackoverflow.com/questions/2723397/)
```

### 3. That's it!

No other changes needed. The app will automatically:
- Display the new topic in the sidebar under "Java"
- Render the markdown with syntax highlighting
- Add it to search
- Track it in recent topics

## Markdown Features You Can Use

### Code Blocks with Syntax Highlighting

````markdown
```java
public class Example {
  public static void main(String[] args) {
    System.out.println("Hello!");
  }
}
```

```javascript
function example() {
  console.log("Hello!");
}
```

```bash
npm install
npm run dev
```
````

### Tables

```markdown
| Feature | Basic | Pro |
|---------|-------|-----|
| Users | 5 | Unlimited |
| Support | Email | 24/7 |
| Price | Free | $99/mo |
```

### Lists

```markdown
- Bullet point
  - Nested bullet
  - Another nested

1. First
2. Second
   1. Sub-item
```

### Emphasis

```markdown
**Bold text**
*Italic text*
***Bold and italic***
```

### Links and Images

```markdown
[Link text](https://example.com)
![Alt text for image](https://example.com/image.png)
```

### Blockquotes

```markdown
> This is a quote
> 
> It can span multiple lines
```

### Horizontal Lines

```markdown
---
```

## Development Mode

During development, you can use **Dev Mode Admin** to test admin features without Firebase:

```env
# In .env file
VITE_DEV_ADMIN=true
```

This automatically logs you in as admin, so you can:
- See admin-only pages
- Test drafts and publishing (UI preview)
- View all topics regardless of restrictions

**⚠️ WARNING**: Always set `VITE_DEV_ADMIN=false` before deploying to production!

## Tips for Great Content

1. **Start with a heading** - Use `# Heading` for the main title
2. **Organize with subheadings** - Use `## Subheading`, `### Sub-subheading`
3. **Add examples** - Show code examples for every concept
4. **Use tables** - Great for comparing options
5. **Keep it scannable** - Use lists and bold text
6. **Add warnings/tips** - Use blockquotes for important notes
7. **Link to resources** - Point to official docs or related topics

## Example: Complete Topic

Here's a minimal but complete new topic:

**File: `src/data/topics/java/variance.js`** (just add to the array):
```javascript
{
  slug: 'variance',
  title: 'Generic Variance',
  summary: 'Covariance, contravariance, and invariance explained.',
  tags: ['java', 'generics', 'advanced'],
  gifUrl: null,
  relatedTool: null,
  body: '',
}
```

**File: `src/data/topics/java/variance/content.md`**:
```markdown
# Generic Variance

## What is Variance?

Variance describes how generic types relate to subtyping.

## Three Types

### Invariant
List<Integer> cannot be assigned to List<Number>.

### Covariant
List<Integer> can be assigned to List<? extends Number>.

### Contravariant  
List<Number> can be assigned to List<? super Integer>.
```

That's all! The topic will appear in the sidebar immediately.

## Troubleshooting

**Topic not appearing in sidebar?**
- Make sure `slug` is unique within the category file
- Make sure `body` is an empty string `''` (not omitted)
- Check browser console for errors

**Markdown not rendering?**
- Make sure file path is exactly `src/data/topics/{category}/{slug}/content.md`
- Check that the file contains valid markdown
- Hard refresh browser (Ctrl+Shift+R)

**Code highlighting not working?**
- Specify the language: ` ```java` not just ` ``` `
- Supported languages: java, javascript, python, sql, bash, json, xml, html, css, etc.

## Need Help?

- Check existing topics in `src/data/topics/` for examples
- Look at [CommonMark](https://commonmark.org/) markdown spec
- See [GitHub Flavored Markdown](https://github.github.com/gfm/) for extended features
