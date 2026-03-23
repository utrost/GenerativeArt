# Contributing to Generative Art Framework

## Development Setup

### Java
1. Ensure Java 17+ and Maven 3.6+ are installed
2. Build: `mvn clean package`
3. Run: `java -jar target/generativeart-*.jar`

### Web
1. `cd web && npm install`
2. `npm run dev`

## Adding a New Generator

1. **Java:** Create `src/main/java/.../YourGenerator.java` extending the generator base
2. **Web:** Create `web/src/generators/your-generator.js`
3. Write a `Readme_YourGenerator.md` documenting the algorithm
4. Register in both Java and Web entry points

## Running Tests

### Java
```bash
mvn test
```

### Web
```bash
cd web && npm test
```

Please ensure all tests pass before submitting a pull request. When adding a new generator, add it to the parameterized test lists in both `AllGeneratorsTest.java` and `web/src/generators/allGenerators.test.js`.

## Code Style

- Java: standard conventions, 4-space indent
- Web: vanilla JS, ES modules, no frameworks

## Commit Messages

Use conventional prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
