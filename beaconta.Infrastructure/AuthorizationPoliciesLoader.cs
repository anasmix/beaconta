using beaconta.Infrastructure;
using beaconta.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace beaconta.Api.Security
{
    public static class AuthorizationPoliciesLoader
    {
        public static void AddDynamicPolicies(this AuthorizationOptions options, BeacontaDb db)
        {
            // نجيب كل المفاتيح من جدول Permissions
            var keys = db.Permissions.AsNoTracking().Select(p => p.Key).ToList();

            foreach (var key in keys)
            {
                // إذا مش موجودة نضيفها
                if (!options.GetPolicyNames().Contains(key))
                {
                    options.AddPolicy(key, policy =>
                        policy.RequireClaim("permissions", key));
                }
            }
        }

        private static IEnumerable<string> GetPolicyNames(this AuthorizationOptions options)
        {
            return options.GetType()
                          .GetProperty("PolicyMap", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?
                          .GetValue(options) is IDictionary<string, AuthorizationPolicy> dict
                          ? dict.Keys
                          : Enumerable.Empty<string>();
        }
    }
}
