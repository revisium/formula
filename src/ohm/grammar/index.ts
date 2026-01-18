import * as ohm from 'ohm-js';

// Using String.raw to avoid double-escaping backslashes in Ohm grammar
// In Ohm grammar, we need single backslashes for escape sequences
const grammarText = String.raw`Formula {
  Expression = Ternary

  // Ternary: condition ? then : else
  Ternary
    = LogicalOr "?" Ternary ":" Ternary  -- ternary
    | LogicalOr

  // Logical OR: a || b
  LogicalOr
    = LogicalOr "||" LogicalAnd  -- or
    | LogicalAnd

  // Logical AND: a && b
  LogicalAnd
    = LogicalAnd "&&" Equality  -- and
    | Equality

  // Equality: a == b, a != b
  Equality
    = Equality "==" Comparison  -- eq
    | Equality "!=" Comparison  -- neq
    | Comparison

  // Comparison: a > b, a < b, a >= b, a <= b
  Comparison
    = Comparison ">=" Additive  -- gte
    | Comparison "<=" Additive  -- lte
    | Comparison ">" Additive   -- gt
    | Comparison "<" Additive   -- lt
    | Additive

  // Additive: a + b, a - b
  Additive
    = Additive "+" Multiplicative  -- plus
    | Additive "-" Multiplicative  -- minus
    | Multiplicative

  // Multiplicative: a * b, a / b, a % b
  Multiplicative
    = Multiplicative "*" Unary  -- times
    | Multiplicative "/" Unary  -- div
    | Multiplicative "%" Unary  -- mod
    | Unary

  // Unary: -a, !a
  Unary
    = "-" Unary  -- neg
    | "!" Unary  -- not
    | Postfix

  // Postfix: function calls, property access, array access
  Postfix
    = Postfix "(" Arguments? ")"      -- call
    | Postfix "." identifier          -- property
    | Postfix "[" Expression "]"      -- index
    | Postfix "[" "*" "]"             -- wildcard
    | Primary

  // Arguments for function calls
  Arguments
    = Expression ("," Expression)*

  // Primary expressions
  Primary
    = "(" Expression ")"              -- paren
    | number
    | string
    | boolean
    | null
    | rootPath
    | relativePath
    | contextToken
    | identifier

  // Literals
  number
    = "-"? digit+ "." digit+  -- float
    | "-"? digit+             -- int

  string
    = "\"" doubleStringChar* "\""
    | "'" singleStringChar* "'"

  doubleStringChar
    = ~("\"" | "\\") any  -- regular
    | "\\" any            -- escape

  singleStringChar
    = ~("'" | "\\") any   -- regular
    | "\\" any            -- escape

  boolean
    = "true" ~identifierPart   -- true
    | "false" ~identifierPart  -- false

  null = "null" ~identifierPart

  // Identifiers and paths
  identifier = ~reserved identifierStart identifierPart*

  identifierStart = letter | "_"
  identifierPart = letter | digit | "_"

  // Special paths
  rootPath = "/" identifierPart+

  relativePathPrefix = ".." "/"
  relativePath = relativePathPrefix+ identifierPart+

  contextToken
    = "@" identifierPart+   -- at
    | "#" identifierPart+   -- hash

  // Reserved words (cannot be used as identifiers)
  reserved
    = ("true" | "false" | "null") ~identifierPart

  // Whitespace (implicit, Ohm handles automatically)
}`;

export const grammar = ohm.grammar(grammarText);
