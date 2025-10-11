def obtener_contexto_gastos(user_id: int, db: Session) -> str:
    """
    Obtiene el contexto de gastos del usuario desde la base de datos.
    """
    try:
        hoy = date.today()
        mes_actual = hoy.month
        anio_actual = hoy.year
        
        contexto = f"""
Eres un asistente financiero personal especializado en análisis de gastos.

PRIMER MENSAJE: "¡Hola! Soy tu asistente financiero. Estoy aquí para ayudarte con tus gastos, presupuestos y finanzas. ¿En qué puedo ayudarte? 💰"

Usuario ID: {user_id}
"""
        
        if user_id == 0:
            return contexto
        
        # Gastos del mes
        gastos_mes = db.query(Gasto).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado',
            extract('year', Gasto.fecha) == anio_actual,
            extract('month', Gasto.fecha) == mes_actual
        ).all()
        
        total = sum(float(g.monto) for g in gastos_mes)
        contexto += f"\nGastó este mes: ${total:,.2f} ({len(gastos_mes)} gastos)\n"
        
        # Últimos 3 gastos
        ultimos = db.query(Gasto).join(Categoria).filter(
            Gasto.id_usuario == user_id,
            Gasto.estado == 'confirmado'
        ).order_by(desc(Gasto.fecha)).limit(3).all()
        
        if ultimos:
            contexto += "Últimos: "
            for g in ultimos:
                contexto += f"${g.monto} ({g.categoria.nombre}), "
        
        contexto += "\n💡 Usa estos datos para dar consejos personalizados.\n"
        return contexto
        
    except Exception as e:
        return "Eres un asistente financiero."
