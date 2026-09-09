Optional forces you to explicitly handle the "value might be missing"
case instead of accidentally hitting a NullPointerException.

Example:
  Optional<String> maybeName = Optional.ofNullable(getName());
  String result = maybeName.orElse("Unknown");
