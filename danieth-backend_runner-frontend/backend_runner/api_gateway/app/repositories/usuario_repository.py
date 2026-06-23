from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database.models.usuarios import Usuario


class UsuarioRepository:

    @staticmethod
    async def obtener_por_id(
        session: AsyncSession,
        usuario_id: int
    ):

        query = select(Usuario).where(
            Usuario.id == usuario_id
        )

        result = await session.execute(query)

        return result.scalar_one_or_none()