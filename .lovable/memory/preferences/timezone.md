---
name: Brasília timezone
description: All date calculations must use Brasília timezone (America/Sao_Paulo), never UTC
type: preference
---
Use `getTodayBrasilia()` from `@/lib/utils` for all "today" date strings.
Use `getNowBrasilia()` for current datetime.
Never use `new Date().toISOString().split('T')[0]` for today's date.
