"""
API-specific enums for service status and responses.

These are specific to the FastAPI service and don't have
direct Kotlin equivalents.
"""

from enum import Enum


class HealthStatusEnum(str, Enum):
	"""
	Service health status for monitoring and load balancers.
	"""
	HEALTHY = 'healthy'
	DEGRADED = 'degraded'
	UNHEALTHY = 'unhealthy'

	@property
	def is_operational(self) -> bool:
		"""Returns True if service can handle requests."""
		return self in (self.HEALTHY, self.DEGRADED)

