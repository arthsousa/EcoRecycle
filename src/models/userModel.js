const supabase = require('../config/supabase');

class UserModel {
    static async signIn(email, password) {
        return await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
    }

    static async getProfileById(userId) {
        return await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();
    }
}

module.exports = UserModel;
