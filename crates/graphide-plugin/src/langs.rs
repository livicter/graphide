//! Declarative tree-sitter extract queries. Same capture vocabulary for every language.
//! A language exists here when it has a grammar + these queries (SPEC §3).

use tree_sitter::Language;

pub struct Lang {
    pub id: &'static str,
    pub extensions: &'static [&'static str],
    pub sep: &'static str,
    pub language: fn() -> Language,
    pub queries: &'static str,
}

pub const PYTHON: Lang = Lang {
    id: "python@0.1.0",
    extensions: &["py"],
    sep: ".",
    language: || tree_sitter_python::LANGUAGE.into(),
    queries: r#"
(function_definition
  name: (identifier) @fn.name) @fn.def

(class_definition
  name: (identifier) @type.name) @type.def

(class_definition
  name: (identifier) @impl.type
  body: (block
    (function_definition
      name: (identifier) @method.name) @method.def))

(call
  function: [
    (identifier) @call.name
    (attribute attribute: (identifier) @call.name)
  ]) @call

(type (identifier) @ty.use)

(import_from_statement
  module_name: (dotted_name) @import.mod
  name: (dotted_name
    (identifier) @import.name))

(import_from_statement
  module_name: (dotted_name) @import.mod
  name: (aliased_import
    name: (dotted_name
      (identifier) @import.name)))

(import_statement
  name: (dotted_name) @import.mod)

(import_statement
  name: (aliased_import
    name: (dotted_name) @import.mod
    alias: (identifier) @import.name))
"#,
};

pub const JAVASCRIPT: Lang = Lang {
    id: "javascript@0.1.0",
    extensions: &["js", "jsx", "mjs", "cjs"],
    sep: ".",
    language: || tree_sitter_javascript::LANGUAGE.into(),
    queries: JS_QUERIES,
};

pub const TYPESCRIPT: Lang = Lang {
    id: "typescript@0.1.0",
    extensions: &["ts", "tsx"],
    sep: ".",
    language: || tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
    queries: TS_QUERIES,
};

const JS_QUERIES: &str = r#"
(function_declaration
  name: (identifier) @fn.name) @fn.def

(generator_function_declaration
  name: (identifier) @fn.name) @fn.def

(class_declaration
  name: (identifier) @type.name) @type.def

(class_declaration
  name: (identifier) @impl.type
  body: (class_body
    (method_definition
      name: (property_identifier) @method.name) @method.def))

(call_expression
  function: [
    (identifier) @call.name
    (member_expression
      property: (property_identifier) @call.name)
  ]) @call

(new_expression
  constructor: (identifier) @ty.use)

(import_statement
  (import_clause
    (named_imports
      (import_specifier
        name: (identifier) @import.name)))
  source: (string) @import.mod)

(import_statement
  (import_clause (identifier) @import.name)
  source: (string) @import.mod)
"#;

const TS_QUERIES: &str = r#"
(function_declaration
  name: (identifier) @fn.name) @fn.def

(generator_function_declaration
  name: (identifier) @fn.name) @fn.def

(class_declaration
  name: (type_identifier) @type.name) @type.def

(class_declaration
  name: (type_identifier) @impl.type
  body: (class_body
    (method_definition
      name: (property_identifier) @method.name) @method.def))

(call_expression
  function: [
    (identifier) @call.name
    (member_expression
      property: (property_identifier) @call.name)
  ]) @call

(type_identifier) @ty.use
(new_expression
  constructor: (identifier) @ty.use)

(import_statement
  (import_clause
    (named_imports
      (import_specifier
        name: (identifier) @import.name)))
  source: (string) @import.mod)

(import_statement
  (import_clause (identifier) @import.name)
  source: (string) @import.mod)
"#;

pub const C: Lang = Lang {
    id: "c@0.1.0",
    extensions: &["c", "h"],
    sep: "::",
    language: || tree_sitter_c::LANGUAGE.into(),
    queries: C_QUERIES,
};

/// C grammar has no class / qualified / destructor nodes (those are C++ only).
const C_QUERIES: &str = r#"
(function_definition
  declarator: (function_declarator
    declarator: (identifier) @fn.name)) @fn.def

(function_definition
  declarator: (pointer_declarator
    declarator: (function_declarator
      declarator: (identifier) @fn.name))) @fn.def

(struct_specifier
  name: (type_identifier) @type.name) @type.def

(call_expression
  function: [
    (identifier) @call.name
    (field_expression
      field: (field_identifier) @call.name)
  ]) @call

(type_identifier) @ty.use

(preproc_include
  path: [
    (string_literal) @import.mod
    (system_lib_string) @import.mod
  ])
"#;

pub const CPP: Lang = Lang {
    id: "cpp@0.1.0",
    extensions: &["cc", "cpp", "cxx", "hpp", "hh", "hxx"],
    sep: "::",
    language: || tree_sitter_cpp::LANGUAGE.into(),
    queries: C_FAMILY_QUERIES,
};

const C_FAMILY_QUERIES: &str = r#"
(function_definition
  declarator: (function_declarator
    declarator: [
      (identifier) @fn.name
      (qualified_identifier
        name: (identifier) @fn.name)
      (destructor_name (identifier) @fn.name)
    ])) @fn.def

(class_specifier
  name: (type_identifier) @type.name) @type.def

(struct_specifier
  name: (type_identifier) @type.name) @type.def

(call_expression
  function: [
    (identifier) @call.name
    (field_expression
      field: (field_identifier) @call.name)
    (qualified_identifier
      name: (identifier) @call.name)
  ]) @call

(type_identifier) @ty.use

(class_specifier
  name: (type_identifier) @impl.type
  body: (field_declaration_list
    (function_definition
      declarator: (function_declarator
        declarator: (identifier) @method.name)) @method.def))

(preproc_include
  path: [
    (string_literal) @import.mod
    (system_lib_string) @import.mod
  ])
"#;

pub const GO: Lang = Lang {
    id: "go@0.1.0",
    extensions: &["go"],
    sep: ".",
    language: || tree_sitter_go::LANGUAGE.into(),
    queries: r#"
(function_declaration
  name: (identifier) @fn.name) @fn.def

(method_declaration
  receiver: (parameter_list
    (parameter_declaration
      type: [
        (type_identifier) @impl.type
        (pointer_type (type_identifier) @impl.type)
      ]))
  name: (field_identifier) @method.name) @method.def

(type_declaration
  (type_spec
    name: (type_identifier) @type.name)) @type.def

(call_expression
  function: [
    (identifier) @call.name
    (selector_expression
      field: (field_identifier) @call.name)
  ]) @call

(type_identifier) @ty.use

(import_spec
  name: (package_identifier) @import.name
  path: (interpreted_string_literal) @import.mod)

(import_spec
  path: (interpreted_string_literal) @import.mod)
"#,
};

pub const ALL: &[&Lang] = &[&PYTHON, &JAVASCRIPT, &TYPESCRIPT, &C, &CPP, &GO];

pub fn for_extension(ext: &str) -> Option<&'static Lang> {
    let ext = ext.trim_start_matches('.').to_ascii_lowercase();
    ALL.iter()
        .copied()
        .find(|l| l.extensions.contains(&ext.as_str()))
}
