from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12,
    argon2__time_cost=2,
    argon2__memory_cost=102400,
    argon2__parallelism=8,
)

# Hash almacenado en la base de datos
stored_hash = "$argon2id$v=19$m=102400,t=2,p=8$wriXsjZmLMVYy9mbM+b8Hw$PsPjBUNViuGC1fxSqd5vVwAZ6fvqGw536B1toHM6+Vw"

# Contraseña proporcionada por el usuario
password = "NicoM1234#"

print("=" * 60)
print("VERIFICACIÓN DE CONTRASEÑA")
print("=" * 60)
print(f"\nContraseña a verificar: {password}")
print(f"Hash almacenado: {stored_hash[:50]}...")
print(f"Longitud del hash: {len(stored_hash)}")

# Verificar la contraseña
try:
    result = pwd_context.verify(password, stored_hash)
    print(f"\n✓ Resultado de verificación: {result}")
    
    if result:
        print("\n✅ LA CONTRASEÑA ES CORRECTA!")
        print("El cambio de contraseña debería funcionar con esta contraseña como 'actual'")
    else:
        print("\n❌ LA CONTRASEÑA NO COINCIDE")
        print("Hay un problema con el hash o la contraseña proporcionada")
        
except Exception as e:
    print(f"\n❌ ERROR durante la verificación: {e}")

# Generar un nuevo hash con la misma contraseña para comparar
print("\n" + "=" * 60)
print("GENERANDO NUEVO HASH DE LA MISMA CONTRASEÑA")
print("=" * 60)
new_hash = pwd_context.hash(password)
print(f"Nuevo hash generado: {new_hash[:50]}...")
print(f"\nVerificando nuevo hash: {pwd_context.verify(password, new_hash)}")
