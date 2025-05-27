# Mermaid Diagram Examples

This file demonstrates WebLama's support for Mermaid diagrams.

## Flow Chart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Continue]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant WebLama
    participant BexyLama
    participant BEXY
    
    User->>WebLama: Edit markdown
    WebLama->>BexyLama: Generate code
    BexyLama->>BEXY: Execute code
    BEXY-->>BexyLama: Return results
    BexyLama-->>WebLama: Return formatted output
    WebLama-->>User: Display results
```

## Class Diagram

```mermaid
classDiagram
    class WebLama {
        +markdown_dir: str
        +run()
        +edit_file()
    }
    class BexyLama {
        +generate_code()
        +fix_code()
    }
    class BEXY {
        +execute_code()
        +sandbox_run()
    }
    WebLama --> BexyLama
    WebLama --> BEXY
```

## Try Your Own

You can edit this file to create your own Mermaid diagrams. WebLama will render them in real-time!
