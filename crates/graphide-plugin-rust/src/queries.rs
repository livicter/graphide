//! Declarative tree-sitter extract queries (SPEC default plugin shape).

pub const EXTRACT_QUERIES: &str = r#"
(function_item
  name: (identifier) @fn.name) @fn.def

(struct_item
  name: (type_identifier) @type.name) @type.def

(enum_item
  name: (type_identifier) @type.name) @type.def

(trait_item
  name: (type_identifier) @type.name) @type.def

(type_item
  name: (type_identifier) @type.name) @type.def

(union_item
  name: (type_identifier) @type.name) @type.def

(impl_item
  type: [
    (type_identifier) @impl.type
    (generic_type type: (type_identifier) @impl.type)
    (scoped_type_identifier) @impl.type
  ]
  body: (declaration_list
    (function_item
      name: (identifier) @method.name) @method.def)) @impl

(const_item
  name: (identifier) @const.name
  type: (_) @const.type) @const.def

(static_item
  name: (identifier) @const.name
  type: (_) @const.type) @const.def

(let_declaration) @let

(call_expression
  function: [
    (identifier) @call.name
    (scoped_identifier) @call.name
    (field_expression
      field: (field_identifier) @call.name)
  ]) @call

(type_identifier) @ty.use
(scoped_type_identifier) @ty.use

(identifier) @ident
(scoped_identifier) @path

(use_declaration) @use

(attribute_item) @attr
"#;
