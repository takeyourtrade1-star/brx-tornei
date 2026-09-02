// Validazione e normalizzazione degli origin di destinazione. Nessun target
// remoto puo essere contattato senza conferma esplicita dell'hostname.

function parseOrigin(rawValue, name, protocols) {
  const raw = String(rawValue || '').trim();
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)\/?$/i.exec(raw);
  if (!match) throw new Error(`${name} non e un origin valido`);
  const protocol = `${match[1].toLowerCase()}:`;
  if (!protocols.includes(protocol)) {
    throw new Error(`${name} usa uno schema non supportato`);
  }
  const authority = match[2];
  if (!authority || authority.includes('@') || /\s/.test(authority)) {
    throw new Error(`${name} deve contenere solo scheme e host`);
  }

  let hostname;
  let port = null;
  if (authority.startsWith('[')) {
    const closingBracket = authority.indexOf(']');
    if (closingBracket < 0) throw new Error(`${name} contiene un host IPv6 non valido`);
    hostname = authority.slice(1, closingBracket);
    const suffix = authority.slice(closingBracket + 1);
    if (suffix) {
      if (!suffix.startsWith(':')) throw new Error(`${name} contiene una porta non valida`);
      port = suffix.slice(1);
    }
    if (!/^[0-9a-f:.]+$/i.test(hostname)) {
      throw new Error(`${name} contiene un host IPv6 non valido`);
    }
  } else {
    const separator = authority.lastIndexOf(':');
    if (separator >= 0) {
      if (authority.indexOf(':') !== separator) {
        throw new Error(`${name} richiede parentesi quadre per un host IPv6`);
      }
      hostname = authority.slice(0, separator);
      port = authority.slice(separator + 1);
    } else {
      hostname = authority;
    }
    if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(hostname)) {
      throw new Error(`${name} contiene un host non valido`);
    }
  }
  if (port !== null && (!/^\d+$/.test(port) || Number(port) > 65535)) {
    throw new Error(`${name} contiene una porta non valida`);
  }
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '');
  const renderedHostname = normalizedHostname.includes(':')
    ? `[${normalizedHostname}]`
    : normalizedHostname;
  return {
    origin: `${protocol}//${renderedHostname}${port === null ? '' : `:${port}`}`,
    hostname: normalizedHostname,
  };
}

export function canonicalOrigin(name, fallback) {
  return parseOrigin(__ENV[name] || fallback, name, ['http:', 'https:']).origin;
}

export function canonicalWebSocketOrigin(name, fallback) {
  return parseOrigin(__ENV[name] || fallback, name, ['ws:', 'wss:']).origin;
}

function normalizedHostname(origin) {
  return parseOrigin(origin, 'origin', ['http:', 'https:', 'ws:', 'wss:']).hostname;
}

function confirmationHosts() {
  const configured = [__ENV.LOAD_TEST_CONFIRM_HOSTS, __ENV.LOAD_TEST_CONFIRM_HOST]
    .filter((value) => value !== undefined && value !== '')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase().replace(/\.$/, ''))
    .filter(Boolean);
  const invalid = configured.find(
    (host) =>
      host === '*' ||
      host.includes('://') ||
      host.includes('/') ||
      /\s/.test(host) ||
      (!/^[a-z0-9.-]+$/.test(host) && !/^\[?[0-9a-f:]+\]?$/.test(host)),
  );
  if (invalid) {
    throw new Error(
      `LOAD_TEST_CONFIRM_HOSTS contiene un host non valido: ${invalid}. Usa solo hostname esatti separati da virgola`,
    );
  }
  return new Set(configured.map((host) => host.replace(/^\[/, '').replace(/\]$/, '')));
}

function isLocalHostname(hostname) {
  return new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal']).has(hostname);
}

export function assertRemoteConfirmation(...origins) {
  const remoteHosts = origins
    .filter(Boolean)
    .map(normalizedHostname)
    .filter((host) => !isLocalHostname(host));
  const confirmed = confirmationHosts();
  const missing = [...new Set(remoteHosts)].filter((host) => !confirmed.has(host));
  if (missing.length > 0) {
    throw new Error(
      `Target remoto non autorizzato: ${missing.join(', ')}. Imposta LOAD_TEST_CONFIRM_HOSTS=${missing.join(',')} (hostname esatti)`,
    );
  }
}
