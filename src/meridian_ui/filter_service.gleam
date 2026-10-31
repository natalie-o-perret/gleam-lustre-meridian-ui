import gleam/list
import gleam/string

pub type Match {
  StartsWith
  Contains
  EndsWith
  Equals
  NotEquals
}

pub type NumberMatch {
  LessThan
  LessOrEqual
  GreaterThan
  GreaterOrEqual
  EqualTo
}

pub type Operator {
  All
  Any
}

pub fn text(value: String, query: String, mode: Match) -> Bool {
  let value = normalise(value)
  let query = normalise(string.trim(query))
  case query, mode {
    "", _ -> True
    _, StartsWith -> string.starts_with(value, query)
    _, Contains -> string.contains(value, query)
    _, EndsWith -> string.ends_with(value, query)
    _, Equals -> value == query
    _, NotEquals -> value != query
  }
}

pub fn number(value: Float, query: Float, mode: NumberMatch) -> Bool {
  case mode {
    LessThan -> value <. query
    LessOrEqual -> value <=. query
    GreaterThan -> value >. query
    GreaterOrEqual -> value >=. query
    EqualTo -> value == query
  }
}

pub fn filter(
  items: List(item),
  operator: Operator,
  tests: List(fn(item) -> Bool),
) -> List(item) {
  list.filter(items, fn(item) {
    case operator {
      All -> list.all(tests, fn(predicate) { predicate(item) })
      Any -> tests == [] || list.any(tests, fn(predicate) { predicate(item) })
    }
  })
}

@external(javascript, "./filter_ffi.mjs", "normalise")
fn normalise(value: String) -> String
