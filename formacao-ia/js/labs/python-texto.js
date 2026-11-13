// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
/** Traceback do MicroPython, sem as linhas internas do app e com “linha N do seu código”. */
export function limparErro(t) {
  return String(t).split('\n')
    .filter((l) => !/File "<stdin>"/.test(l))
    .map((l) => l.replace(/File "<string>", line (\d+)(, in <module>)?/, 'linha $1 do seu código').replace(/File "<string>", line (\d+), in (\w+)/, 'linha $1 do seu código, dentro de $2'))
    .join('\n');
}

